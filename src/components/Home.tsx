import Card from "../atoms/Card"

import { mainPageData } from "../data"

const Home = () => {
  return (
    <div className="home">
      <div className="container">
        <div className="row align-items-center my-5">
          <div className="col-lg-7">
            <img
              className="img-fluid rounded mb-4 mb-lg-0"
              src="http://placehold.it/900x400"
              alt=""
            />
          </div>
          <div className="col-lg-5">
            <h1 className="font-weight-light">Home</h1>
            <p>
              Lorem Ipsum is simply dummy text of the printing and typesetting
              industry. Lorem Ipsum has been the industry's standard dummy text
              ever since the 1500s, when an unknown printer took a galley of
              type and scrambled it to make a type specimen book.
            </p>
          </div>
          {/* <div className="grid">
              {mainPageData.pages.map((project: any, index: number) => (
                <Card {...project}></Card>
                // <Card
                //   key={index}
                //   heading={project.title}
                //   paragraph={project.para}
                //   imgUrl={project.imageSrc}
                //   projectLink={project.url}
                // ></Card>
              ))}
          </div> */}
        </div>
      </div>
    </div>
  );
}

export default Home;